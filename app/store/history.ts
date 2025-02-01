import { create } from 'zustand';
import { Node } from '../types/node'

type HistoryAction = {
  type: 'ADD_NODE' | 'EDIT_NODE' | 'DELETE_NODE' | 'MOVE_NODE' | 'CHANGE_COLOR'
  treeId: string
  data: {
    node?: Node
    parentId?: string
    prevSiblingId?: string | null
    oldText?: string
    newText?: string
    oldParentId?: string
    oldPrevSiblingId?: string | null
    oldColor?: string | null
    newColor?: string | null
  }
}

type HistoryState = {
  past: HistoryAction[]
  future: HistoryAction[]
  addToHistory: (action: HistoryAction) => void
  undo: () => HistoryAction | undefined
  redo: () => HistoryAction | undefined
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  past: [],
  future: [],

  addToHistory: (action: HistoryAction) =>
    set((state) => ({
      past: [...state.past, action],
      future: [], // 新しいアクションが追加されたら、futureをクリア
    })),

  undo: () => {
    let actionToReturn: HistoryAction | undefined
    set((state) => {
      const lastAction = state.past[state.past.length - 1]
      if (!lastAction) return state

      actionToReturn = lastAction
      return {
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      }
    })
    return actionToReturn
  },

  redo: () => {
    let actionToReturn: HistoryAction | undefined
    set((state) => {
      const nextAction = state.future[0]
      if (!nextAction) return state

      actionToReturn = nextAction
      return {
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      }
    })
    return actionToReturn
  },

  clearHistory: () =>
    set(() => ({
      past: [],
      future: [],
    })),
}))
