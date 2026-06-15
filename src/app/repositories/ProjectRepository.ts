import { BASE_API_URL } from "../core/constants";
import type {
  IAddMemberPayload,
  ICreateProjectPayload,
  IProject,
  IProjectListData,
  IProjectListQuery,
  IProjectMemberData,
  IProjectMembersData,
  IProjectResponseData,
  IUpdateProjectPayload,
} from "../entities/project.entity";
import { BaseApiService } from "./BaseApiService";

export class ProjectRepository extends BaseApiService<IProject> {
  url: string;

  constructor() {
    super(`${BASE_API_URL}/projects`);
    this.url = `${BASE_API_URL}/projects`;
  }

  async listProjectsAsync(query: IProjectListQuery) {
    return await this.listWithCountAsync<IProjectListData>(query);
  }

  async getProjectByIdAsync(id: string) {
    return await this.getOtherTypeAsync<IProjectResponseData>({
      url: `${this.url}/${id}`,
      query: {},
    });
  }

  async createProjectAsync(value: ICreateProjectPayload) {
    return await this.createOtherTypeAsync<IProjectResponseData>({
      url: this.url,
      value,
    });
  }

  async updateProjectAsync(id: string, value: IUpdateProjectPayload) {
    return await this.patchOtherTypeAsync<IProjectResponseData>({
      url: `${this.url}/${id}`,
      value,
    });
  }

  async deleteProjectAsync(id: string) {
    return await this.removeOtherTypeAsync<null>(`${this.url}/${id}`);
  }

  async listMembersAsync(id: string) {
    return await this.getOtherTypeAsync<IProjectMembersData>({
      url: `${this.url}/${id}/members`,
      query: {},
    });
  }

  async addMemberAsync(id: string, value: IAddMemberPayload) {
    return await this.createOtherTypeAsync<IProjectMemberData>({
      url: `${this.url}/${id}/members`,
      value,
    });
  }

  async removeMemberAsync(id: string, userId: string) {
    return await this.removeOtherTypeAsync<null>(`${this.url}/${id}/members/${userId}`);
  }
}
