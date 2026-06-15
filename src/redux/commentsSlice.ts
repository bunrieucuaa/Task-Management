import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { IComment } from "@/app/entities/comment.entity";
import { CommentRepository } from "@/app/repositories/CommentRepository";

export interface ICommentsState {
  items: IComment[];
  /** Which task the loaded comments belong to (null = none open). */
  taskId: number | null;
  loading: boolean;
  submitting: boolean;
}

const initialState: ICommentsState = {
  items: [],
  taskId: null,
  loading: false,
  submitting: false,
};

export const fetchComments = createAsyncThunk(
  "comments/fetchComments",
  async (taskId: number) => {
    const response = await new CommentRepository().listCommentsAsync(taskId);
    if (response.success && response.data) {
      return { taskId, items: response.data.data };
    }
    return { taskId, items: [] };
  },
);

export const createComment = createAsyncThunk(
  "comments/createComment",
  async (payload: { taskId: number; content: string }) => {
    const response = await new CommentRepository().createCommentAsync(payload.taskId, {
      content: payload.content,
    });
    if (response.success && response.data) {
      return response.data.comment;
    }
    return null;
  },
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (payload: { taskId: number; commentId: number }) => {
    const response = await new CommentRepository().deleteCommentAsync(
      payload.taskId,
      payload.commentId,
    );
    if (response.success) {
      return payload.commentId;
    }
    return null;
  },
);

export const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearComments(state) {
      state.items = [];
      state.taskId = null;
      state.loading = false;
      state.submitting = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchComments.pending, (state, action) => {
      state.loading = true;
      // Reset list when switching to a different task to avoid stale flashes.
      if (state.taskId !== action.meta.arg) {
        state.items = [];
        state.taskId = action.meta.arg;
      }
    });
    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.loading = false;
      state.taskId = action.payload.taskId;
      state.items = action.payload.items;
    });
    builder.addCase(fetchComments.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(createComment.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(createComment.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        // Appended at the end — the BE returns comments oldest-first.
        state.items = [...state.items, action.payload];
      }
    });
    builder.addCase(createComment.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(deleteComment.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(deleteComment.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
    });
    builder.addCase(deleteComment.rejected, (state) => {
      state.submitting = false;
    });
  },
});

export const { clearComments } = commentsSlice.actions;
export default commentsSlice.reducer;
