import { BASE_API_URL } from "../core/constants";
import type {
  IComment,
  ICommentListData,
  ICommentListQuery,
  ICommentResponseData,
  ICreateCommentPayload,
} from "../entities/comment.entity";
import { BaseApiService } from "./BaseApiService";

/**
 * Comments live under a task: /api/v1/tasks/:taskId/comments
 * The base url is unused for nested resources, so each call builds its own.
 */
export class CommentRepository extends BaseApiService<IComment> {
  constructor() {
    super(`${BASE_API_URL}/tasks`);
  }

  private commentsUrl(taskId: number) {
    return `${BASE_API_URL}/tasks/${taskId}/comments`;
  }

  async listCommentsAsync(taskId: number, query: ICommentListQuery = {}) {
    return await this.listOTherTypeWithCountAsync<ICommentListData>({
      url: this.commentsUrl(taskId),
      query,
    });
  }

  async createCommentAsync(taskId: number, value: ICreateCommentPayload) {
    return await this.createOtherTypeAsync<ICommentResponseData>({
      url: this.commentsUrl(taskId),
      value,
    });
  }

  async deleteCommentAsync(taskId: number, commentId: number) {
    return await this.removeOtherTypeAsync<null>(
      `${this.commentsUrl(taskId)}/${commentId}`,
    );
  }
}
