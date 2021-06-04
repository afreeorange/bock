import React from "react";
import { BiHomeSmile, BiSearch } from "react-icons/bi";
import { IoDiceOutline, IoDocumentsOutline } from "react-icons/io5";

import Router from "./Router";
import { Articles, Recent, Search, Compare, Revision, Random } from "./pages";

export const baseNavigationLinks = [
  {
    name: "Search",
    title: "Search this site",
    href: "/search",
    icon: <BiSearch />,
  },
  {
    name: "Home",
    title: "Go to this wiki's homepage",
    href: "/Hello",
    icon: <BiHomeSmile />,
  },
  {
    name: "Articles",
    title: "List of all articles in this wiki",
    href: "/articles",
    icon: <IoDocumentsOutline />,
  },
  {
    name: "Random",
    title: "Roll the dice!",
    href: "/random",
    icon: <IoDiceOutline />,
  },
  // {
  //   name: "Dark Mode",
  //   title: "Go Dark!",
  //   href: "#",
  //   icon: <CgDarkMode />,
  // },
];

export const nonArticleRouteMap: Record<string, React.ReactNode> = {
  "/search/:term": <Search />,
  "/search": <Search />,
  "/articles": <Articles />,
  "/recent": <Recent />,
  "/random": <Random />,

  /**
   * This is special. TODO: Explain why.
   */
  "/ROOT": <Router />,
};

export const nonArticleRoutes = Object.keys(nonArticleRouteMap);

const RouteMap: Record<string, React.ReactNode> = {
  ...nonArticleRouteMap,
  "/:maybeArticlePath+/revisions/:revisionId/raw": <Revision />,
  "/:maybeArticlePath+/revisions/:revisionId": <Revision />,
  "/:maybeArticlePath+/revisions": <Router />,
  "/:maybeArticlePath+/compare": <Compare />,
  "/:maybeArticlePath+/raw": <Router />,
  "/:maybeArticlePath+": <Router />,
};

export default RouteMap;
