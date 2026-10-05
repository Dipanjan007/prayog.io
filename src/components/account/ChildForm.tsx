"use client";

import { useState } from "react";
import { CLASSES, type ClassNum } from "@/content/curriculum";
import { AVATARS, NICKNAME_RULE } from "@/lib/shared";

export interface ChildValues {
  nickname: string;
  classNum: ClassNum;
  avatar: string;
  showOnLeaderboard: boolean;
}

/** Nickname, class, avatar and leaderboard choice for a child's profile. */
export default function ChildForm({
  onSubmit,
  onBack,
  submitLabel,
  busy,
  hideClass,
}: {
  onSubmit: (v: ChildValues) => void;
  onBack?: () => void;
  submitLabel: string;
  busy?: boolean;
  /** Class comes from the school class instead. */
  hideClass?: boolean;
}) {
  const [nickname, setNickname] = useState("");
  const [classNum, setClassNum] = useState<ClassNum>(8);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const nicknameOk = NICKNAME_RULE.test(nickname.trim());

  return (
    <>
      <label className="mt-5 grid gap-1 text-sm">
        <span className="text-muted">Nickname (not your real name)</span>
        <input className="field" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. StormRider" />
        {nickname && !nicknameOk && <span className="text-xs text-brick-300">3 to 16 letters, numbers or spaces.</span>}
      </label>
      {!hideClass && (
        <>
          <div className="mt-4 text-sm text-muted">Class</div>
          <div className="mt-1 flex gap-2">
            {CLASSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassNum(c)}
                className={`flex-1 rounded-xl border py-2 ${classNum === c ? "chip-on" : "border-line"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 text-sm text-muted">Avatar</div>
      <div className="mt-1 grid grid-cols-6 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className={`rounded-xl border py-2 text-2xl ${avatar === a ? "border-heather-300 bg-heather-300/15" : "border-line"}`}
            aria-label={`Avatar ${a}`}
          >
            {a}
          </button>
        ))}
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-saffron-400"
          checked={showOnLeaderboard}
          onChange={(e) => setShowOnLeaderboard(e.target.checked)}
        />
        <span>Show my nickname on my class leaderboard (you can change this later).</span>
      </label>
      <div className="mt-6 flex gap-3">
        {onBack && (
          <button type="button" className="btn-ghost" onClick={onBack}>
            Back
          </button>
        )}
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={!nicknameOk || busy}
          onClick={() => onSubmit({ nickname: nickname.trim(), classNum, avatar, showOnLeaderboard })}
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </>
  );
}
