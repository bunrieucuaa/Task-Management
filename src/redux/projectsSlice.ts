import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  IAddMemberPayload,
  ICreateProjectPayload,
  IProject,
  IProjectListQuery,
  IProjectMember,
  IProjectPagination,
  IUpdateProjectPayload,
} from "@/app/entities/project.entity";
import { ProjectRepository } from "@/app/repositories/ProjectRepository";
import { UserRepository } from "@/app/repositories/UserRepository";
import type { IUserDirectoryItem } from "@/app/entities/user.entity";

const initialFilters: IProjectListQuery = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const initialPagination: IProjectPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export interface IProjectsState {
  items: IProject[];
  selectedProject: IProject | null;
  pagination: IProjectPagination;
  loading: boolean;
  submitting: boolean;
  members: IProjectMember[];
  membersLoading: boolean;
  directory: IUserDirectoryItem[];
  directoryLoading: boolean;
}

const initialState: IProjectsState = {
  items: [],
  selectedProject: null,
  pagination: initialPagination,
  loading: false,
  submitting: false,
  members: [],
  membersLoading: false,
  directory: [],
  directoryLoading: false,
};

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (query: IProjectListQuery) => {
    const response = await new ProjectRepository().listProjectsAsync(query);
    if (response.success && response.data) {
      return { items: response.data.data, pagination: response.data.pagination };
    }
    return { items: [], pagination: initialPagination };
  },
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchProjectById",
  async (id: string) => {
    const response = await new ProjectRepository().getProjectByIdAsync(id);
    if (response.success && response.data) {
      return response.data.project;
    }
    return null;
  },
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (payload: ICreateProjectPayload) => {
    const response = await new ProjectRepository().createProjectAsync(payload);
    if (response.success && response.data) {
      return response.data.project;
    }
    return null;
  },
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async (payload: { id: string; data: IUpdateProjectPayload }) => {
    const response = await new ProjectRepository().updateProjectAsync(payload.id, payload.data);
    if (response.success && response.data) {
      return response.data.project;
    }
    return null;
  },
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id: string) => {
    const response = await new ProjectRepository().deleteProjectAsync(id);
    if (response.success) {
      return id;
    }
    return null;
  },
);

export const fetchMembers = createAsyncThunk(
  "projects/fetchMembers",
  async (id: string) => {
    const response = await new ProjectRepository().listMembersAsync(id);
    if (response.success && response.data) {
      return response.data.members;
    }
    return [];
  },
);

export const addMember = createAsyncThunk(
  "projects/addMember",
  async (payload: { id: string; data: IAddMemberPayload }) => {
    const response = await new ProjectRepository().addMemberAsync(payload.id, payload.data);
    if (response.success && response.data) {
      return response.data.member;
    }
    return null;
  },
);

export const removeMember = createAsyncThunk(
  "projects/removeMember",
  async (payload: { id: string; userId: string }) => {
    const response = await new ProjectRepository().removeMemberAsync(payload.id, payload.userId);
    if (response.success) {
      return Number(payload.userId);
    }
    return null;
  },
);

/** ACTIVE-user directory for member/assignee pickers (ADMIN + PM only). */
export const fetchDirectory = createAsyncThunk("projects/fetchDirectory", async () => {
  const response = await new UserRepository().getDirectoryAsync();
  if (response.success && response.data) {
    return response.data.users;
  }
  return [];
});

export const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearSelectedProject(state) {
      state.selectedProject = null;
      state.members = [];
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProjects.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchProjects.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(fetchProjectById.fulfilled, (state, action) => {
      state.selectedProject = action.payload;
    });

    builder.addCase(createProject.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(createProject.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = [action.payload, ...state.items];
      }
    });
    builder.addCase(createProject.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(updateProject.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(updateProject.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        const updated = action.payload;
        state.items = state.items.map((item) => (item.id === updated.id ? updated : item));
        if (state.selectedProject?.id === updated.id) {
          state.selectedProject = updated;
        }
      }
    });
    builder.addCase(updateProject.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(deleteProject.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = state.items.filter((item) => String(item.id) !== action.payload);
      }
    });
    builder.addCase(deleteProject.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(fetchDirectory.pending, (state) => {
      state.directoryLoading = true;
    });
    builder.addCase(fetchDirectory.fulfilled, (state, action) => {
      state.directoryLoading = false;
      state.directory = action.payload;
    });
    builder.addCase(fetchDirectory.rejected, (state) => {
      state.directoryLoading = false;
    });

    builder.addCase(fetchMembers.pending, (state) => {
      state.membersLoading = true;
    });
    builder.addCase(fetchMembers.fulfilled, (state, action) => {
      state.membersLoading = false;
      state.members = action.payload;
    });
    builder.addCase(fetchMembers.rejected, (state) => {
      state.membersLoading = false;
    });

    builder.addCase(addMember.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(addMember.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.members = [...state.members, action.payload];
      }
    });
    builder.addCase(addMember.rejected, (state) => {
      state.submitting = false;
    });

    builder.addCase(removeMember.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(removeMember.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.members = state.members.filter((member) => member.userId !== action.payload);
      }
    });
    builder.addCase(removeMember.rejected, (state) => {
      state.submitting = false;
    });
  },
});

export const { clearSelectedProject } = projectsSlice.actions;
export { initialFilters, initialPagination };
export default projectsSlice.reducer;
