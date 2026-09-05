export type CreateToolRequestInput = {
  description: string;
};

export type ToolRequest = {
  id: string;
  description: string;
  votes: number;
  bountyCents: number;
  createdAt: Date;
};