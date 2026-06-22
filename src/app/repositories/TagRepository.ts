import { BASE_API_URL } from "../core/constants";
import type {
  ICreateTagPayload,
  ITag,
  ITagListData,
  ITagResponseData,
} from "../entities/tag.entity";
import { BaseApiService } from "./BaseApiService";

/**
 * Tags are a global catalog at /api/v1/tags, plus task-scoped attach/detach
 * under /api/v1/tasks/:taskId/tags. The base url covers the catalog; nested
 * calls build their own url.
 */
export class TagRepository extends BaseApiService<ITag> {
  constructor() {
    super(`${BASE_API_URL}/tags`);
  }

  private taskTagsUrl(taskId: number) {
    return `${BASE_API_URL}/tasks/${taskId}/tags`;
  }

  async listTagsAsync() {
    return await this.listOTherTypeWithCountAsync<ITagListData>({
      url: `${BASE_API_URL}/tags`,
      query: {},
    });
  }

  async createTagAsync(value: ICreateTagPayload) {
    return await this.createOtherTypeAsync<ITagResponseData>({
      url: `${BASE_API_URL}/tags`,
      value,
    });
  }

  async deleteTagAsync(tagId: number) {
    return await this.removeOtherTypeAsync<null>(`${BASE_API_URL}/tags/${tagId}`);
  }

  async attachToTaskAsync(taskId: number, tagId: number) {
    return await this.createOtherTypeAsync<null>({
      url: this.taskTagsUrl(taskId),
      value: { tagId },
    });
  }

  async detachFromTaskAsync(taskId: number, tagId: number) {
    return await this.removeOtherTypeAsync<null>(
      `${this.taskTagsUrl(taskId)}/${tagId}`,
    );
  }
}
