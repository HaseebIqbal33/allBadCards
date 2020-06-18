import {createSocketMessageClass} from "./SocketMessage";
import {GamePayload} from "../../Games/Game/GameContract";

export const GameMessage = createSocketMessageClass<GamePayload>("game");