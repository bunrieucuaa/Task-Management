import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ICreateTaskPayload,
  ITask,
  ITaskListQuery,
  ITaskPagination,
  IUpdateTaskPayload,
} from "@/app/entities/task.entity";
import { TaskRepository } from "@/app/repositories/TaskRepository";

const initialFilters: ITaskListQuery = {
  page: 1,
  limit: 10,
  projectId: "",
  assigneeId: "",
  status: "",
  priority: "",
  deadlineFrom: "",
  deadlineTo: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const initialPagination: ITaskPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export interface ITasksState {
  items: ITask[];
  pagination: ITaskPagination;
  loading: boolean;
  submitting: boolean;
}

const initialState: ITasksState = {
  items: [],
  pagination: initialPagination,
  loading: false,
  submitting: false,
};

/** Strip empty-string filters so they are not sent as query params. */
const cleanQuery = (query: ITaskListQuery): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      result[key] = value;
    }
  });
  return result;
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (query: ITaskListQuery) => {
    const response = await new TaskRepository().listTasksAsync(
      cleanQuery(query) as unknown as ITaskListQuery,
    );
    if (response.success && response.data) {
      return { items: response.data.data, pagination: response.data.pagination };
    }
    return { items: [], pagination: initialPagination };
  },
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (payload: ICreateTaskPayload) => {
    const response = await new TaskRepository().createTaskAsync(payload);
    if (response.success && response.data) {
      return response.data.task;
    }
    return null;
  },
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (payload: { id: string; data: IUpdateTaskPayload }) => {
    const response = await new TaskRepository().updateTaskAsync(payload.id, payload.data);
    if (response.success && response.data) {
      return response.data.task;
    }
    return null;
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id: string) => {
    const response = await new TaskRepository().deleteTaskAsync(id);
    if (response.success) {
      return id;
    }
    return null;
  },
);

export const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTasks.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchTasks.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(createTask.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(createTask.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = [action.payload, ...state.items];
      }
    });
    builder.addCase(createTask.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(updateTask.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(updateTask.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        const updated = action.payload;
        state.items = state.items.map((item) => (item.id === updated.id ? updated : item));
      }
    });
    builder.addCase(updateTask.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(deleteTask.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = state.items.filter((item) => String(item.id) !== action.payload);
      }
    });
    builder.addCase(deleteTask.rejected, (state) => {
      state.submitting = false;
    });
  },
});

export { initialFilters, initialPagination };
export default tasksSlice.reducer;
