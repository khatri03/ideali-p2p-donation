import { generatePath } from "react-router-dom";

export const CUSTOM_FORM_PATHS = {
  list: "/organizer/custom-form/list",
  create: "/custom-form/create-form",
  edit: "/custom-form/:customFormUniqueId/edit",
} as const;

export function buildCustomFormEditPath(customFormUniqueId: string) {
  return generatePath(CUSTOM_FORM_PATHS.edit as string, { customFormUniqueId });
}
