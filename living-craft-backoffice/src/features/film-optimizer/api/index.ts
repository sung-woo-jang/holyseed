// ===== Query Hooks =====
// Films
export { useFetchFilms, useFetchFilmDetail } from './fetch-films'

// Cutting Projects
export {
  useFetchCuttingProjects,
  useFetchCuttingProjectDetail,
} from './fetch-cutting-projects'

// ===== Mutation Hooks =====
// Films
export { useCreateFilm, useUpdateFilm, useDeleteFilm } from './manage-films'

// Cutting Projects
export {
  useCreateCuttingProject,
  useUpdateCuttingProject,
  useDeleteCuttingProject,
  useAddPieces,
  useUpdatePiece,
  useDeletePiece,
  useTogglePieceComplete,
} from './manage-cutting-projects'

// ===== Types =====
// Films
export type {
  FilmListItem,
  FilmDetail,
  FetchFilmsResponse,
} from './fetch-films'

export type {
  CreateFilmRequest,
  UpdateFilmRequest,
  UpdateFilmVariables,
  CreateFilmResponse,
  UpdateFilmResponse,
} from './manage-films'

// Cutting Projects
export type {
  CuttingProjectListItem,
  CuttingProjectDetail,
  CuttingProjectFilmInfo,
  CuttingPiece,
  PackingResult,
  PackedBin,
  PackedRect,
  FetchCuttingProjectsResponse,
} from './fetch-cutting-projects'

export type {
  CuttingPieceInput,
  CreateCuttingProjectRequest,
  UpdateCuttingProjectRequest,
  UpdateCuttingProjectVariables,
  AddPiecesRequest,
  AddPiecesVariables,
  UpdatePieceRequest,
  UpdatePieceVariables,
  PieceActionVariables,
  AddPiecesResponse,
  UpdatePieceResponse,
  TogglePieceCompleteResponse,
} from './manage-cutting-projects'
