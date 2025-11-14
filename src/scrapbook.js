import { What } from "./main/core/What.js";
import { AsyncEach } from "./main/core/AsyncEach.js";
import { AsyncWhat } from "./main/core/AsyncWhat.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";
import { Each } from "./main/core/Each.js";
import { EventEmitter } from "events";


Each.of(0, 1).sthen(i => console.log(i)).each();
