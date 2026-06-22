export interface ITag {
  id: number;
  name: string;
}

/** GET /tags → { tags: [...] } */
export interface ITagListData {
  tags: ITag[];
}

/** POST /tags → { tag } */
export interface ITagResponseData {
  tag: ITag;
}

export interface ICreateTagPayload {
  name: string;
}
