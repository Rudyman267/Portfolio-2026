import type { StructureResolver } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { CogIcon, UserIcon, CaseIcon } from "@sanity/icons";

/**
 * Desk structure: singletons (Site Settings, Profile) pinned at top,
 * Projects as an orderable list, default doc-type list hidden.
 */
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.listItem()
        .title("Profile")
        .icon(UserIcon)
        .child(S.document().schemaType("profile").documentId("profile")),
      S.divider(),
      orderableDocumentListDeskItem({
        type: "project",
        title: "Projects",
        icon: CaseIcon,
        S,
        context,
      }),
    ]);
