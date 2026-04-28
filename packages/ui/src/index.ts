import { cx } from "class-variance-authority";

export const cn = (...inputs: Parameters<typeof cx>) => cx(inputs);