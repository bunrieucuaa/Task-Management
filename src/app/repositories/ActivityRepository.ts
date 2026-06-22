import { BASE_API_URL } from "../core/constants";
import type {
  IActivityListData,
  IActivityListQuery,
} from "../entities/activity.entity";
import { BaseApiService } from "./BaseApiService";

/**
 * Activity logs live under a task: /api/v1/tasks/:taskId/activities.
 * Read-only (BE writes entries automatically inside task mutations).
 */
export class ActivityRepository extends BaseApiService<never> {
  constructor() {
    super(`${BASE_API_URL}/tasks`);
  }

  private activitiesUrl(taskId: number) {
    return `${BASE_API_URL}/tasks/${taskId}/activities`;
  }

  async listByTaskAsync(taskId: number, query: IActivityListQuery = {}) {
    return await this.listOTherTypeWithCountAsync<IActivityListData>({
      url: this.activitiesUrl(taskId),
      query,
    });
  }
}
