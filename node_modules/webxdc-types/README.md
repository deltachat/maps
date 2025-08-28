# Types for webxdc

When you develop a [webxdc app](https://webxdc.org), you use the [webxdc
API](https://docs.webxdc.org/spec.html) to communicate with other instances of
the same webxdc application.

The API is available on `window.webxdc`.

When you develop your webxdc app in TypeScript, it's handy to have proper
types for this API. This library provides those types for you.

## Why use this?

- you want better autocomplete in your IDE (js and ts)
- you want to see docuemntation on hover in your IDE (js and ts)
- you need types for typescript typechecking

## Usage

You can install this using:

```shell
npm install -D webxdc-types
```

<details>
<summary> Usage in Typescript with typed payload (Recommended) </summary>

You should have a type that describes your webxdc payload structure in use
by your application:

```typescript
type Payload = {
  label: string;
  value: number;
};
```

Once you have a `Payload` type, you can declare the type of `window.webxdc` in
your application:

```typescript
import { WebXdc } from "webxdc-types";

declare global {
  interface Window {
    webxdc: WebXdc<Payload>;
  }
}
```

(write this in a file that is picked up by the typescript compiler, paths like `src/types.d.ts` or `src/global.d.ts` should work)

Now `window.webxdc` should be fully typed.

</details>

<details>
<summary> Usage in Typescript without payload typing </summary>

Use this if you just want completions for the api, but not for the status update payloads, they will get the `any` type with this method.

```typescript
import "webxdc-types/global";
// or
/// <reference types="webxdc-types/global" />
```

Now `window.webxdc` should be typed.

</details>

<details>
<summary> 
usage in plain javascript files (jsdoc)
</summary>

If your IDE supports it (vscode and it's forks do), you can add `//@ts-check` to the top of your javascript file to enable typescript type checking for it.

you can then type variables like this

```js
//@ts-check

/** @type {number} documentation of the value */
const my_var = 8;
```

You can use this to import the webxdc types when you need them to type your functions:

```js
/**
 * @typedef {any} MyPayload
 * @typedef {import('webxdc-types').XDCFile} XDCFile
 * @typedef {import('webxdc-types').ReceivedStatusUpdate<MyPayload>} ReceivedStatusUpdate
 * @typedef {import('webxdc-types').SendingStatusUpdate<MyPayload>} SendingStatusUpdate
 * @typedef {import('webxdc-types').Webxdc<MyPayload>} Webxdc
 */
// note that this does not set `window.webxdc` for you follow the steps below for that.
```

### Without typed payloads

If you just want the api and not want to type your payloads you can import the types for `window.webxdc` like this:

```
/** @typedef {import('webxdc-types/global')} */
```

### With typed payloads

For this you need to create a `mytypes.d.ts` file declaring your payload type:

```typescript
import { WebXdc } from "webxdc-types";

// do your own payload type here
type Payload = {
  label: string;
  value: number;
};

declare global {
  interface Window {
    webxdc: WebXdc<Payload>;
  }
}
```

Then import this file like this:

```js
/** @typedef {import('./my_types')} */
```

</details>


<details>
<summary> 
usage without package manager (npm, yarn, pnpm and so on.)
</summary>

Copy `global.d.ts` and `webxdc.d.ts` files into your project and use one of the methods above, adjusting the import path acordingly.

```js
/** @typedef {import('./global')} */
/** @typedef {import('./webxdc')} */
```

You can also combine the two files if you have basic knowledge of typescript.

</details>