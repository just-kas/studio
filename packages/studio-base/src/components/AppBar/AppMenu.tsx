// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Menu, PopoverPosition, PopoverReference } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";
import { shallow } from "zustand/shallow";

import TextMiddleTruncate from "@foxglove/studio-base/components/TextMiddleTruncate";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import { useCurrentUserType } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import {
  WorkspaceContextStore,
  useWorkspaceActions,
  useWorkspaceStore,
} from "@foxglove/studio-base/context/WorkspaceContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

import { NestedMenuItem, MenuItem } from "./NestedMenuItem";

type AppMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

const useStyles = makeStyles()({
  menuList: {
    minWidth: 180,
    maxWidth: 220,
  },
  truncate: {
    alignSelf: "center !important",
  },
});

const selectWorkspace = (store: WorkspaceContextStore) => store;

export function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();
  const { t } = useTranslation("appBar");

  const [nestedMenu, setNestedMenu] = useState<string | undefined>();

  const currentUserType = useCurrentUserType();
  const analytics = useAnalytics();

  const { recentSources, selectRecent } = usePlayerSelection();
  const { leftSidebarOpen, rightSidebarOpen } = useWorkspaceStore(selectWorkspace, shallow);
  const { setRightSidebarOpen, setLeftSidebarOpen, dataSourceDialogActions, prefsDialogActions } =
    useWorkspaceActions();

  const handleNestedMenuClose = useCallback(() => {
    setNestedMenu(undefined);
    handleClose();
  }, [handleClose]);

  const handleItemPointerEnter = useCallback((id: string) => {
    setNestedMenu(id);
  }, []);

  const handleAnalytics = useCallback(
    (cta: string) => {
      void analytics.logEvent(AppEvent.APP_MENU_CLICK, {
        user: currentUserType,
        cta,
      });
    },
    [analytics, currentUserType],
  );

  // FILE

  const fileItems = useMemo(() => {
    const items: MenuItem[] = [
      {
        type: "item",
        label: t("openLocalFile"),
        key: "open-file",
        onClick: () => {
          dataSourceDialogActions.open("file");
          handleAnalytics("open-file");
          handleNestedMenuClose();
        },
      },
      {
        type: "item",
        label: t("openConnection"),
        key: "open-connection",
        onClick: () => {
          dataSourceDialogActions.open("connection");
          handleAnalytics("open-connection");
          handleNestedMenuClose();
        },
      },
      { type: "divider" },
      { type: "item", label: t("recentDataSources"), key: "recent-sources", disabled: true },
    ];

    recentSources.slice(0, 5).map((recent) => {
      items.push({
        type: "item",
        key: recent.id,
        onClick: () => {
          handleAnalytics("open-recent");
          selectRecent(recent.id);
          handleNestedMenuClose();
        },
        label: <TextMiddleTruncate text={recent.title} className={classes.truncate} />,
      });
    });

    return items;
  }, [
    classes.truncate,
    dataSourceDialogActions,
    handleAnalytics,
    handleNestedMenuClose,
    recentSources,
    selectRecent,
    t,
  ]);

  // VIEW

  const viewItems = useMemo<MenuItem[]>(
    () => [
      {
        type: "item",
        label: leftSidebarOpen ? t("hideLeftSidebar") : t("showLeftSidebar"),
        key: "left-sidebar",
        shortcut: "[",
        onClick: () => {
          setLeftSidebarOpen(!leftSidebarOpen);
          handleNestedMenuClose();
        },
      },
      {
        type: "item",
        label: rightSidebarOpen ? t("hideRightSidebar") : t("showRightSidebar"),
        key: "right-sidebar",
        shortcut: "]",
        onClick: () => {
          setRightSidebarOpen(!rightSidebarOpen);
          handleNestedMenuClose();
        },
      },
    ],
    [
      handleNestedMenuClose,
      leftSidebarOpen,
      rightSidebarOpen,
      setLeftSidebarOpen,
      setRightSidebarOpen,
      t,
    ],
  );

  // HELP

  const onAboutClick = useCallback(() => {
    prefsDialogActions.open("about");
    handleAnalytics("about");
    handleNestedMenuClose();
  }, [handleAnalytics, handleNestedMenuClose, prefsDialogActions]);

  const onDocsClick = useCallback(() => {
    handleAnalytics("docs");
    window.open("https://foxglove.dev/docs", "_blank");
    handleNestedMenuClose();
  }, [handleAnalytics, handleNestedMenuClose]);

  const onSlackClick = useCallback(() => {
    handleAnalytics("join-slack");
    window.open("https://foxglove.dev/slack", "_blank");
    handleNestedMenuClose();
  }, [handleAnalytics, handleNestedMenuClose]);

  const helpItems = useMemo<MenuItem[]>(
    () => [
      { type: "item", key: "about", label: t("about"), onClick: onAboutClick },
      { type: "divider" },
      { type: "item", key: "docs", label: t("viewOurDocs"), onClick: onDocsClick, external: true },
      {
        type: "item",
        key: "join-slack",
        label: t("joinOurSlack"),
        onClick: onSlackClick,
        external: true,
      },
    ],
    [onAboutClick, onDocsClick, onSlackClick, t],
  );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="app-menu"
        open={open}
        disableAutoFocusItem
        onClose={handleNestedMenuClose}
        MenuListProps={{ dense: true, className: classes.menuList }}
      >
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={fileItems}
          open={nestedMenu === "app-menu-file"}
          id="app-menu-file"
        >
          {t("file")}
        </NestedMenuItem>
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={viewItems}
          open={nestedMenu === "app-menu-view"}
          id="app-menu-view"
        >
          {t("view")}
        </NestedMenuItem>
        <NestedMenuItem
          onPointerEnter={handleItemPointerEnter}
          items={helpItems}
          open={nestedMenu === "app-menu-help"}
          id="app-menu-help"
        >
          {t("help")}
        </NestedMenuItem>
      </Menu>
    </>
  );
}