import { IAppConfig } from "@models/App.ts";

declare global {
    var ccv_config: Readonly<IAppConfig>
}