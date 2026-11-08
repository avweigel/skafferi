import { z } from "zod";

export const householdNameSchema = z.object({
  name: z.string().trim().min(1, "give the household a name").max(80),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("enter a valid email"),
});

export type HouseholdNameInput = z.infer<typeof householdNameSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
