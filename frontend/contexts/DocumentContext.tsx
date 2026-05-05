"use client";

import {
  createContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useState,
} from "react";
import {
  NdaSnapshot,
  listDocuments,
  renameDocument as renameDocumentAPI,
  updateTags as updateTagsAPI,
  deleteDocument as deleteDocumentAPI,
} from "@/utils/api";

export interface DocumentState {
  documents: NdaSnapshot[];
  isLoading: boolean;
  error: string | null;
}

type DocumentAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DOCUMENTS"; payload: NdaSnapshot[] }
  | { type: "ADD_DOCUMENT"; payload: NdaSnapshot }
  | { type: "UPDATE_DOCUMENT"; payload: NdaSnapshot }
  | { type: "REMOVE_DOCUMENT"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" };

const initialState: DocumentState = {
  documents: [],
  isLoading: false,
  error: null,
};

function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DOCUMENTS":
      return { ...state, documents: action.payload, error: null };
    case "ADD_DOCUMENT":
      return {
        ...state,
        documents: [action.payload, ...state.documents],
      };
    case "UPDATE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.payload.id ? action.payload : doc
        ),
      };
    case "REMOVE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.filter((doc) => doc.id !== action.payload),
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export interface DocumentContextType {
  state: DocumentState;
  loadDocuments: () => Promise<void>;
  renameDocument: (id: string, title: string) => Promise<void>;
  updateTags: (id: string, tags: string[]) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [state, dispatch] = useReducer(documentReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load documents on mount
  useEffect(() => {
    const initDocuments = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const docs = await listDocuments();
        dispatch({ type: "SET_DOCUMENTS", payload: docs });
      } catch (error) {
        console.error("Failed to load documents:", error);
        // Don't treat as an error - documents list is optional
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initDocuments();
    }
  }, [isInitialized]);

  const loadDocuments = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const docs = await listDocuments();
      dispatch({ type: "SET_DOCUMENTS", payload: docs });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load documents",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const renameDocument = useCallback(async (id: string, title: string) => {
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const updated = await renameDocumentAPI(id, title);
      dispatch({ type: "UPDATE_DOCUMENT", payload: updated });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to rename document",
      });
      throw error;
    }
  }, []);

  const updateTags = useCallback(async (id: string, tags: string[]) => {
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const updated = await updateTagsAPI(id, tags);
      dispatch({ type: "UPDATE_DOCUMENT", payload: updated });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update tags",
      });
      throw error;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    dispatch({ type: "CLEAR_ERROR" });
    try {
      await deleteDocumentAPI(id);
      dispatch({ type: "REMOVE_DOCUMENT", payload: id });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to delete document",
      });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: DocumentContextType = {
    state,
    loadDocuments,
    renameDocument,
    updateTags,
    deleteDocument,
    clearError,
  };

  return (
    <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
  );
}
