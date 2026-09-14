import React from "react";
import { avatars } from "../shared/questions.js";

// Local vector artwork stays crisp at every size and needs no uploads.
export function Avatar({ index }) {
  return index >= 3 && index <= 6 ? (
    <img
      className="avatar-art"
      src={`/avatars/${index}.svg`}
      alt=""
      draggable="false"
    />
  ) : (
    <span aria-hidden="true">{avatars[index]}</span>
  );
}
