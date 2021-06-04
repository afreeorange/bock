import React from "react";
import { NavLink, useRouteMatch, useLocation } from "react-router-dom";
import { RiHistoryFill } from "react-icons/ri";
import { GoMarkdown } from "react-icons/go";
import { BiCodeAlt } from "react-icons/bi";

import { baseNavigationLinks, nonArticleRoutes } from "../Routes";
import { MaybePath } from "../types";
import { classNames } from "../helpers";

import "./Nav.css";

const Nav: React.FC = () => {
  let articleRoute;

  const term = useRouteMatch<MaybePath>("/search/:term");
  const { pathname } = useLocation();
  const non = term || nonArticleRoutes.includes(pathname);

  const base = useRouteMatch<MaybePath>("/:maybeArticlePath+");
  const raw = useRouteMatch<MaybePath>("/:maybeArticlePath+/raw");
  const compare = useRouteMatch<MaybePath>("/:maybeArticlePath+/compare");
  const revisions = useRouteMatch<MaybePath>("/:maybeArticlePath+/revisions");
  const revision = useRouteMatch<
    MaybePath & {
      revisionId: string;
    }
  >("/:maybeArticlePath+/revisions/:revisionId");
  const revisionRaw = useRouteMatch<
    MaybePath & {
      revisionId: string;
    }
  >("/:maybeArticlePath+/revisions/:revisionId/raw");

  if (revisionRaw) {
    articleRoute = revisionRaw.params.maybeArticlePath;
  } else if (revision) {
    articleRoute = revision.params.maybeArticlePath;
  } else if (revisions) {
    articleRoute = revisions.params.maybeArticlePath;
  } else if (compare) {
    articleRoute = compare.params.maybeArticlePath;
  } else if (raw) {
    articleRoute = raw.params.maybeArticlePath;
  } else {
    articleRoute = base?.params.maybeArticlePath;
  }

  return (
    <nav aria-label="main">
      <ul>
        {baseNavigationLinks.map((item) => (
          <li>
            <NavLink
              key={item.name}
              className={classNames(item.href === pathname ? "active" : "")}
              title={item.title}
              to={item.href}
            >
              {item.icon}
            </NavLink>
          </li>
        ))}

        {!non && base && (
          <>
            {
              <li>
                <NavLink
                  activeClassName="active"
                  exact
                  title="Revisions"
                  to={`/${articleRoute}/revisions`}
                >
                  <RiHistoryFill />
                </NavLink>
              </li>
            }
            {!raw && !revision && !compare && (
              <li>
                <NavLink
                  activeClassName="active"
                  exact
                  title="Raw article"
                  to={`/${articleRoute}/raw`}
                >
                  <GoMarkdown />
                </NavLink>
              </li>
            )}
            {!raw && revision && (
              <li>
                <NavLink
                  activeClassName="active"
                  exact
                  title="Raw article"
                  to={`/${revision.params.maybeArticlePath}/revisions/${revision.params.revisionId}/raw`}
                >
                  <GoMarkdown />
                </NavLink>
              </li>
            )}
            {raw && !revisionRaw && (
              <li>
                <NavLink
                  activeClassName="active"
                  exact
                  title="Article revision "
                  to={`/${articleRoute}`}
                >
                  <BiCodeAlt />
                </NavLink>
              </li>
            )}
            {raw && revisionRaw && (
              <li>
                <NavLink
                  activeClassName="active"
                  exact
                  title="Article revision source"
                  to={`/${revisionRaw.params.maybeArticlePath}/revisions/${revisionRaw.params.revisionId}`}
                >
                  <BiCodeAlt />
                </NavLink>
              </li>
            )}
          </>
        )}
      </ul>
    </nav>
  );
};

export default Nav;
