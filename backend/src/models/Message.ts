import mongoose, {Schema, type Document} from "mongoose";

export type MessageType = "text" | "image";

export interface IMessage extends Document{
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text:string;
  messageType: MessageType;
  imageUrl?: string;
  createdAt:Date;
  updatedAt:Date;
}

const MessageSchema = new Schema<IMessage>({
   chat:{
    type:Schema.Types.ObjectId,
    ref: "Chat",
    required: true,

   },
   sender:{
    type:Schema.Types.ObjectId,
    ref: "User",
    required:true,
   },
   text:{
    type:String,
    trim:true,
    default: "",
   },
   messageType:{
    type:String,
    enum:["text", "image"],
    default:"text",
   },
   imageUrl:{
    type:String,
    default: "",
   }
},{
  timestamps:true
});
// indexes for faster query
MessageSchema.index({chat : 1, createdAt : 1});

// 1 -> ascending
// -1 -> descending

export const Message = mongoose.model("Message",MessageSchema);