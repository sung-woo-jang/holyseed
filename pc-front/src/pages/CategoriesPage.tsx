import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { categoriesApi } from '@/lib/pc-api'
import type { CategoryNode } from '@/lib/pc-api'
import { qk } from '@/queries/keys'

function DragHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className="inline-flex items-center justify-center w-5 h-5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mr-2 select-none"
      title="드래그하여 순서 변경"
    >
      ⠿
    </span>
  )
}

function SortableRow({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: CategoryNode
  level: number
  onEdit: (node: CategoryNode) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? '#f0f9ff' : undefined,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-2.5 text-sm text-gray-900" style={{ paddingLeft: `${16 + level * 20}px` }}>
        <DragHandle {...listeners} {...attributes} />
        {level > 0 && <span className="text-gray-300 mr-2">└</span>}
        {node.name}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-500">{level === 0 ? '최상위' : ''}</td>
      <td className="px-4 py-2.5 text-sm text-gray-500">{node.sortOrder}</td>
      <td className="px-4 py-2.5 text-right">
        <button onClick={() => onEdit(node)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">수정</button>
        {node.children.length === 0 && (
          <button
            onClick={() => { if (confirm('카테고리를 삭제할까요?')) onDelete(node.id) }}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            삭제
          </button>
        )}
      </td>
    </tr>
  )
}

function SortableGroup({
  nodes,
  level,
  containerId,
  onEdit,
  onDelete,
}: {
  nodes: CategoryNode[]
  level: number
  containerId: string
  onEdit: (node: CategoryNode) => void
  onDelete: (id: number) => void
}) {
  return (
    <SortableContext id={containerId} items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
      {nodes.map((node) => (
        <>
          <SortableRow key={node.id} node={node} level={level} onEdit={onEdit} onDelete={onDelete} />
          {node.children.length > 0 && (
            <SortableGroup
              key={`children-${node.id}`}
              nodes={node.children}
              level={level + 1}
              containerId={`parent-${node.id}`}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </>
      ))}
    </SortableContext>
  )
}

export function CategoriesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', parentId: '', sortOrder: '0' })
  const [error, setError] = useState('')
  const [localTree, setLocalTree] = useState<CategoryNode[] | null>(null)

  const { data: tree } = useQuery({
    queryKey: qk.categoryTree(),
    queryFn: categoriesApi.tree,
    select: (data) => data,
  })

  const { data: all } = useQuery({ queryKey: qk.categoriesAll(), queryFn: categoriesApi.all })

  const displayTree = localTree ?? tree ?? []

  const save = useMutation({
    mutationFn: () =>
      editId
        ? categoriesApi.update(editId, { name: form.name, parentId: form.parentId ? parseInt(form.parentId) : undefined, sortOrder: parseInt(form.sortOrder) })
        : categoriesApi.create({ name: form.name, parentId: form.parentId ? parseInt(form.parentId) : undefined, sortOrder: parseInt(form.sortOrder) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categoryTree() })
      qc.invalidateQueries({ queryKey: qk.categoriesAll() })
      setLocalTree(null)
      setShowForm(false); setEditId(null); setForm({ name: '', parentId: '', sortOrder: '0' }); setError('')
    },
    onError: (err: any) => setError(err.response?.data?.message || '저장 실패'),
  })

  const del = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categoryTree() })
      qc.invalidateQueries({ queryKey: qk.categoriesAll() })
      setLocalTree(null)
    },
    onError: (err: any) => alert(err.response?.data?.message || '삭제 실패'),
  })

  const reorder = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => categoriesApi.reorder(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categoryTree() })
      qc.invalidateQueries({ queryKey: qk.categoriesAll() })
    },
    onError: () => setLocalTree(null),
  })

  const startEdit = (node: CategoryNode) => {
    setForm({ name: node.name, parentId: node.parentId ? String(node.parentId) : '', sortOrder: String(node.sortOrder) })
    setEditId(node.id); setShowForm(true)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const findGroupByContainerId = (
    nodes: CategoryNode[],
    containerId: string,
  ): CategoryNode[] | null => {
    if (containerId === 'root') return nodes
    const match = containerId.match(/^parent-(\d+)$/)
    if (!match) return null
    const parentId = parseInt(match[1])
    for (const node of nodes) {
      if (node.id === parentId) return node.children
      const found = findGroupByContainerId(node.children, containerId)
      if (found) return found
    }
    return null
  }

  const updateGroupInTree = (
    nodes: CategoryNode[],
    containerId: string,
    newGroup: CategoryNode[],
  ): CategoryNode[] => {
    if (containerId === 'root') return newGroup
    const match = containerId.match(/^parent-(\d+)$/)
    if (!match) return nodes
    const parentId = parseInt(match[1])
    return nodes.map((node) => {
      if (node.id === parentId) return { ...node, children: newGroup }
      return { ...node, children: updateGroupInTree(node.children, containerId, newGroup) }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceContainerId = active.data.current?.sortable?.containerId as string | undefined
    const destContainerId = over.data.current?.sortable?.containerId as string | undefined

    if (!sourceContainerId || sourceContainerId !== destContainerId) return

    const currentTree = displayTree
    const group = findGroupByContainerId(currentTree, sourceContainerId)
    if (!group) return

    const oldIndex = group.findIndex((n) => n.id === active.id)
    const newIndex = group.findIndex((n) => n.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(group, oldIndex, newIndex)
    const withNewOrder = reordered.map((n, i) => ({ ...n, sortOrder: i }))
    const newTree = updateGroupInTree(currentTree, sourceContainerId, withNewOrder)
    setLocalTree(newTree)

    reorder.mutate(withNewOrder.map(({ id, sortOrder }) => ({ id, sortOrder })))
  }

  const flatAll = (all as any[]) || []

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">카테고리 관리</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', parentId: '', sortOrder: '0' }) }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700"
        >
          + 카테고리 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-100">
          <h2 className="font-semibold text-gray-900 mb-4">{editId ? '카테고리 수정' : '카테고리 추가'}</h2>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">카테고리명 *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="예: 주방후드" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">부모 카테고리</label>
              <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">최상위</option>
                {flatAll.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">취소</button>
            <button onClick={() => save.mutate()} disabled={!form.name || save.isPending}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm disabled:opacity-50">저장</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">구분</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">순서</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {displayTree.length > 0 ? (
                <SortableGroup
                  nodes={displayTree}
                  level={0}
                  containerId="root"
                  onEdit={startEdit}
                  onDelete={(id) => del.mutate(id)}
                />
              ) : (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">카테고리가 없습니다.</td></tr>
              )}
            </DndContext>
          </tbody>
        </table>
      </div>
      {reorder.isPending && (
        <p className="text-xs text-gray-400 mt-2 text-right">순서 저장 중...</p>
      )}
    </div>
  )
}
