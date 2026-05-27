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
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { pcCategoriesApi, pcKeys } from '@/queries/pc'
import type { PcCategoryNode } from '@/queries/pc'
import { useToastStore } from '@/stores/toast'

function SortableRow({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: PcCategoryNode
  level: number
  onEdit: (node: PcCategoryNode) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })
  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderBottom: '1px solid var(--ink-6)',
      }}
    >
      <td style={{ padding: `8px 12px 8px ${12 + level * 20}px`, fontSize: 13 }}>
        <span
          {...listeners}
          {...attributes}
          style={{ display: 'inline-block', marginRight: 8, color: 'var(--ink-5)', cursor: 'grab', userSelect: 'none' }}
          title="드래그로 순서 변경"
        >⠿</span>
        {level > 0 && <span style={{ color: 'var(--ink-5)', marginRight: 6 }}>└</span>}
        {node.name}
      </td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink-4)' }}>{level === 0 ? '최상위' : ''}</td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink-4)' }}>{node.sortOrder}</td>
      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
        <button className="btn ghost sm" style={{ fontSize: 11, marginRight: 4 }} onClick={() => onEdit(node)}>수정</button>
        {node.children.length === 0 && (
          <button
            className="btn ghost sm"
            style={{ fontSize: 11, color: 'var(--ink-3)' }}
            onClick={() => { if (confirm('카테고리를 삭제할까요?')) onDelete(node.id) }}
          >삭제</button>
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
  nodes: PcCategoryNode[]
  level: number
  containerId: string
  onEdit: (node: PcCategoryNode) => void
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

export default function PcCategoriesPage() {
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', parentId: '', sortOrder: '0' })
  const [localTree, setLocalTree] = useState<PcCategoryNode[] | null>(null)

  const { data: tree } = useQuery({ queryKey: pcKeys.categoryTree(), queryFn: pcCategoriesApi.tree })
  const { data: all } = useQuery({ queryKey: pcKeys.categoriesAll(), queryFn: pcCategoriesApi.all })

  const displayTree = localTree ?? tree ?? []

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: pcKeys.categoryTree() })
    qc.invalidateQueries({ queryKey: pcKeys.categoriesAll() })
  }

  const save = useMutation({
    mutationFn: () =>
      editId
        ? pcCategoriesApi.update(editId, { name: form.name, parentId: form.parentId ? parseInt(form.parentId) : undefined, sortOrder: parseInt(form.sortOrder) })
        : pcCategoriesApi.create({ name: form.name, parentId: form.parentId ? parseInt(form.parentId) : undefined, sortOrder: parseInt(form.sortOrder) }),
    onSuccess: () => {
      invalidate()
      setLocalTree(null)
      setShowForm(false)
      setEditId(null)
      setForm({ name: '', parentId: '', sortOrder: '0' })
      showToast(editId ? '카테고리가 수정됐어요' : '카테고리가 추가됐어요')
    },
    onError: (err: any) => showToast(err.response?.data?.message || '저장 실패', 'error'),
  })

  const del = useMutation({
    mutationFn: (id: number) => pcCategoriesApi.delete(id),
    onSuccess: () => { invalidate(); setLocalTree(null); showToast('카테고리가 삭제됐어요') },
    onError: (err: any) => showToast(err.response?.data?.message || '삭제 실패', 'error'),
  })

  const reorder = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => pcCategoriesApi.reorder(items),
    onSuccess: () => invalidate(),
    onError: () => setLocalTree(null),
  })

  const startEdit = (node: PcCategoryNode) => {
    setForm({ name: node.name, parentId: node.parentId ? String(node.parentId) : '', sortOrder: String(node.sortOrder) })
    setEditId(node.id)
    setShowForm(true)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const findGroupByContainerId = (nodes: PcCategoryNode[], id: string): PcCategoryNode[] | null => {
    if (id === 'root') return nodes
    const match = id.match(/^parent-(\d+)$/)
    if (!match) return null
    const parentId = parseInt(match[1])
    for (const node of nodes) {
      if (node.id === parentId) return node.children
      const found = findGroupByContainerId(node.children, id)
      if (found) return found
    }
    return null
  }

  const updateGroupInTree = (nodes: PcCategoryNode[], containerId: string, newGroup: PcCategoryNode[]): PcCategoryNode[] => {
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
    const srcId = active.data.current?.sortable?.containerId as string | undefined
    const dstId = over.data.current?.sortable?.containerId as string | undefined
    if (!srcId || srcId !== dstId) return
    const group = findGroupByContainerId(displayTree, srcId)
    if (!group) return
    const oldIndex = group.findIndex((n) => n.id === active.id)
    const newIndex = group.findIndex((n) => n.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(group, oldIndex, newIndex).map((n, i) => ({ ...n, sortOrder: i }))
    setLocalTree(updateGroupInTree(displayTree, srcId, reordered))
    reorder.mutate(reordered.map(({ id, sortOrder }) => ({ id, sortOrder })))
  }

  const flatAll = (all as any[]) || []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="h2">카테고리 관리</h1>
        <button className="btn primary sm" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', parentId: '', sortOrder: '0' }) }}>
          + 카테고리 추가
        </button>
      </div>

      {showForm && (
        <div className="card card-pad mb-16">
          <h3 className="h3 mb-16">{editId ? '카테고리 수정' : '카테고리 추가'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12, marginBottom: 12 }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>카테고리명 *</div>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 주방후드" />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>부모 카테고리</div>
              <select className="input" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
                <option value="">최상위</option>
                {flatAll.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>정렬 순서</div>
              <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost sm" onClick={() => setShowForm(false)}>취소</button>
            <button className="btn primary sm" onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
              {save.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--ink-6)' }}>
              {['카테고리명', '구분', '순서', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>{h}</th>
              ))}
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
                <tr><td colSpan={4} className="empty" style={{ padding: '32px 12px' }}>카테고리가 없습니다.</td></tr>
              )}
            </DndContext>
          </tbody>
        </table>
      </div>
      {reorder.isPending && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-4)', textAlign: 'right' }}>순서 저장 중...</div>
      )}
    </div>
  )
}
