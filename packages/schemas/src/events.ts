import { z } from "zod";

// Define the schema for pointer events
export const PointerEventSchema = z.object({
  type: z.literal("pointer"),
  data: z.object({
    userId: z.string(),
    x: z.number(),
    y: z.number(),
  }),
});

export const ExcalidrawElementChangeSchema = z.object({
  type: z.literal("elementChange"),
  data: z.array(z.any()),
});

// Add user join/leave events
export const UserJoinEventSchema = z.object({
  type: z.literal("userJoin"),
  data: z.object({
    userId: z.string(),
  }),
});

export const UserLeaveEventSchema = z.object({
  type: z.literal("userLeave"),
  data: z.object({
    userId: z.string(),
  }),
});

export type PointerEvent = z.infer<typeof PointerEventSchema>;
export type ExcalidrawElementChange = z.infer<
  typeof ExcalidrawElementChangeSchema
>;
export type UserJoinEvent = z.infer<typeof UserJoinEventSchema>;
export type UserLeaveEvent = z.infer<typeof UserLeaveEventSchema>;

export const BufferEvent = z.union([
  PointerEventSchema,
  ExcalidrawElementChangeSchema,
  UserJoinEventSchema,
  UserLeaveEventSchema,
]);

export type BufferEventType = z.infer<typeof BufferEvent>;
