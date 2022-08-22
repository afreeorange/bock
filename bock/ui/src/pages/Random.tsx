import React, { useEffect, useState } from "react";
import { Redirect } from "react-router";
import { Loading, Oops, Randomizing } from "../components";

import { useRandom } from "../hooks/app";

const Component: React.FC = () => {
  const { state, data } = useRandom();
  const [dummy, dummyDone] = useState(false);

  /**
   * Just some stupid shit...
   */
  useEffect(() => {
    setTimeout(() => {
      dummyDone(true);
    }, 1000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "Loaded" && data) {
    if (!dummy) {
      return <Randomizing />;
    }

    return <Redirect to={data.name} />;
  }

  if (state === "Error") {
    return <Oops />;
  }

  return <Loading />;
};

export default Component;
