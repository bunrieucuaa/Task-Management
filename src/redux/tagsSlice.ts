import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ITag } from "@/app/entities/tag.entity";
import { TagRepository } from "@/app/repositories/TagRepository";

export interface ITagsState {
  items: ITag[];
  loading: boolean;
  submitting: boolean;
}

const initialState: ITagsState = {
  items: [],
  loading: false,
  submitting: false,
};

export const fetchTags = createAsyncThunk("tags/fetchTags", async () => {
  const response = await new TagRepository().listTagsAsync();
  if (response.success && response.data) {
    return response.data.tags;
  }
  return [];
});

export const createTag = createAsyncThunk(
  "tags/createTag",
  async (name: string) => {
    const response = await new TagRepository().createTagAsync({ name });
    if (response.success && response.data) {
      return response.data.tag;
    }
    return null;
  },
);

export const deleteTag = createAsyncThunk(
  "tags/deleteTag",
  async (tagId: number) => {
    const response = await new TagRepository().deleteTagAsync(tagId);
    if (response.success) {
      return tagId;
    }
    return null;
  },
);

export const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTags.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTags.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchTags.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(createTag.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(createTag.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = [...state.items, action.payload];
      }
    });
    builder.addCase(createTag.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(deleteTag.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(deleteTag.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = state.items.filter((tag) => tag.id !== action.payload);
      }
    });
    builder.addCase(deleteTag.rejected, (state) => {
      state.submitting = false;
    });
  },
});

export default tagsSlice.reducer;
