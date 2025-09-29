import { What } from "./main/core/What.js";
import { AsyncEach } from "./main/core/AsyncEach.js";
import { AsyncWhat } from "./main/core/AsyncWhat.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";
import { Each } from "./main/core/Each.js";


const obj = {val: 5};
    const args = await AsyncEach.of('val')
    .toArray();

console.log(args);
