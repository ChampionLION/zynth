# Remaining literal colors

Generated from current source. UI chrome CSS, map components and Tailwind configuration contain no literal hex/RGB colors outside the token file. The following exceptions remain intentionally visible for later prompts. Raster brand/OG/app-icon assets and standalone historical snapshot galleries are not recolored.

| File | Line | Literal(s) | Reason |
|---|---:|---|---|
| src/app/layout.tsx | 23 | #F6F3EC | Browser metadata; CSS variables cannot be used in theme-color. |
| src/components/AvatarArt.tsx | 12 | #c2a35e, #c2a35e | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 16 | #343b38 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 17 | #252c2a | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 22 | #fff, #fff | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 26 | #593e34 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 28 | #d6b474 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 29 | #d6b474 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 30 | #c69865 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 31 | #b58b5d, #876346, #e0bc7e | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/components/AvatarArt.tsx | 32 | #e5c77f, #8a6c37 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/lib/avatar.ts | 10 | #e8c5ac, #d4a17c, #b97850, #845338, #4e342b | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/lib/avatar.ts | 11 | #292c29, #694735, #d0cec2, #955138 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |
| src/lib/avatar.ts | 12 | #52654d, #ae7843, #526579, #795768 | Avatar artwork/palette; preserved to avoid changing saved appearance choices. |

Legacy RGB aliases in atlas-tokens.css are compatibility values generated from the Atlas palette. Legacy text-primary means ink; copper actions use --primary. Category aliases are neutral ink outside the new small category chips. CSS named transparent/currentColor and Tailwind white/black utility semantics are not literal theme colors.
