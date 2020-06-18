import {createSocketMessageClass} from "./SocketMessage";
import {ChatPayload} from "../../Games/Game/GameContract";

export const ChatMessage = createSocketMessageClass<ChatPayload>("chat");