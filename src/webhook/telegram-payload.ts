import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

const ChatSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
});

const VoiceSchema = z.object({
  file_id: z.string(),
  duration: z.number(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

const PhotoSizeSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  width: z.number(),
  height: z.number(),
  file_size: z.number().optional(),
});

const DocumentSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

const MessageSchema = z.object({
  message_id: z.number(),
  from: UserSchema.optional(),
  chat: ChatSchema,
  date: z.number(),
  text: z.string().optional(),
  voice: VoiceSchema.optional(),
  photo: z.array(PhotoSizeSchema).optional(),
  document: DocumentSchema.optional(),
  caption: z.string().optional(),
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: MessageSchema.optional(),
  edited_message: MessageSchema.optional(),
});

export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;
export type TelegramMessage = z.infer<typeof MessageSchema>;
