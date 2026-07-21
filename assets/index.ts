import { createElement, type ComponentType, type FC } from "react";
import { BlankBoard } from "./backgrounds/blank_board";
import { Desk } from "./backgrounds/desk";
import { Outdoor } from "./backgrounds/outdoor";
import { Learner } from "./characters/learner";
import { Placeholder } from "./placeholder";
import { Arrow } from "./props/arrow";
import { Book } from "./props/book";
import { Brain } from "./props/brain";
import { Checkbox } from "./props/checkbox";
import { Clock } from "./props/clock";
import { Coin } from "./props/coin";
import { Graph } from "./props/graph";
import { Ladder } from "./props/ladder";
import { Lightbulb } from "./props/lightbulb";
import { Phone } from "./props/phone";
import type { AssetProps, CharacterProps } from "./shared";

export type { AssetProps, CharacterProps } from "./shared";

export const characterIds = ["learner"] as const;
export const propIds = [
  "book",
  "phone",
  "arrow",
  "checkbox",
  "lightbulb",
  "graph",
  "coin",
  "clock",
  "brain",
  "ladder",
] as const;
export const backgroundIds = ["blank_board", "desk", "outdoor"] as const;
export const placeholderId = "placeholder" as const;

export type CharacterId = (typeof characterIds)[number];
export type PropId = (typeof propIds)[number];
export type BackgroundId = (typeof backgroundIds)[number];
export type AssetId = CharacterId | PropId | BackgroundId | typeof placeholderId;

const characterRegistry: Record<CharacterId, ComponentType<CharacterProps>> = {
  learner: Learner,
};

const propRegistry: Record<PropId, ComponentType<AssetProps>> = {
  arrow: Arrow,
  book: Book,
  brain: Brain,
  checkbox: Checkbox,
  clock: Clock,
  coin: Coin,
  graph: Graph,
  ladder: Ladder,
  lightbulb: Lightbulb,
  phone: Phone,
};

const backgroundRegistry: Record<BackgroundId, ComponentType<AssetProps>> = {
  blank_board: BlankBoard,
  desk: Desk,
  outdoor: Outdoor,
};

const MissingCharacter: FC<CharacterProps> = ({ accent, className }) => {
  return createElement(Placeholder, { accent, className });
};

export const getCharacter = (id: string): ComponentType<CharacterProps> => {
  return characterRegistry[id as CharacterId] ?? MissingCharacter;
};

export const getProp = (id: string): ComponentType<AssetProps> => {
  return propRegistry[id as PropId] ?? Placeholder;
};

export const getBackground = (id: string): ComponentType<AssetProps> => {
  return backgroundRegistry[id as BackgroundId] ?? Placeholder;
};

export const isAssetId = (id: string): id is AssetId => {
  return (
    (characterIds as readonly string[]).includes(id) ||
    (propIds as readonly string[]).includes(id) ||
    (backgroundIds as readonly string[]).includes(id) ||
    id === placeholderId
  );
};

/**
 * Maps free-form storyboard actions to the six approved learner poses.
 */
export const poseFor = (action: string | undefined): string => {
  const value = (action ?? "").toLowerCase();

  if (/(read|book|study|page)/.test(value)) return "read";
  if (/(think|ponder|idea|consider)/.test(value)) return "think";
  if (/(point|show|gesture|indicate)/.test(value)) return "point";
  if (/(celebrate|win|success|cheer|happy)/.test(value)) return "celebrate";
  if (/(confus|stressed|stress|worry|obstacle|fail|friction)/.test(value)) return "confused";
  return "idle";
};

export { BlankBoard, Desk, Outdoor, Learner, Placeholder };
export { Arrow, Book, Brain, Checkbox, Clock, Coin, Graph, Ladder, Lightbulb, Phone };
