import React from "react";
import { useLocation } from "react-router-dom";

import packageJson from "../../package.json";

export const Footer: React.FC = () => {
  const location = useLocation();

  console.log(location);

  return (
    <footer>
      <p>
        <a href="https://nikhil.io">Nikhil Anand</a> &middot;{" "}
        <a href="https://github.com/afreeorange/bock">
          Bock v{packageJson.version}
        </a>
      </p>
    </footer>
  );
};

export default Footer;
