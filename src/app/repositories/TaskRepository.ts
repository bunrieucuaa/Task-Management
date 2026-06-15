import { BASE_API_URL } from "../core/constants";
import type {
  ICreateTaskPayload,
  ITask,
  ITaskListData,
  ITaskListQuery,
  ITaskResponseData,
  IUpdateTaskPayload,
} from "../entities/task.entity";
import { BaseApiService } from "./BaseApiService";

export class TaskRepository extends BaseApiService<ITask> {
  url: string;

  constructor() {
    super(`${BASE_API_URL}/tasks`);
    this.url = `${BASE_API_URL}/tasks`;
  }

  async listTasksAsync(query: ITaskListQuery) {
    return await this.listWithCountAsync<ITaskListData>(query);
  }

  async getTaskByIdAsync(id: string) {
    return await this.getOtherTypeAsync<ITaskResponseData>({
      url: `${this.url}/${id}`,
      query: {},
    });
  }

  async createTaskAsync(value: ICreateTaskPayload) {
    return await this.createOtherTypeAsync<ITaskResponseData>({
      url: this.url,
      value,
    });
  }

  async updateTaskAsync(id: string, value: IUpdateTaskPayload) {
    return await this.patchOtherTypeAsync<ITaskResponseData>({
      url: `${this.url}/${id}`,
      value,
    });
  }

  async deleteTaskAsync(id: string) {
    return await this.removeOtherTypeAsync<null>(`${this.url}/${id}`);
  }
}
