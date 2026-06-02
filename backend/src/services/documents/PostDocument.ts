import { DBDocument } from "../../db/Database";
import { ParticipantType, PostStatus, UserId } from "../ids";

export interface Participant {
    userId: UserId;
    participantType: ParticipantType;
}

export interface PostDocument extends DBDocument {
    authorId: UserId;
    rule: string;
    title: string;
    description?: string;
    createdAt: Date;
    recruitEndsAt?: Date;

    sessionMode: string;
    sessionLocation?: string;
    sessionDateType: string; // fixed, range, autodate
    sessionFixedDate?: Date; // present if fixed
    sessionRangeDetails?: string; // present if range


    gmCount: number;
    playerCount: number;
    participantCount: number;
    participants: Participant[];
    publishParticipants: boolean;
    acceptJoinRequests: boolean;
}

export function getPostStatus(doc: PostDocument): PostStatus {
    if (doc.recruitEndsAt && doc.recruitEndsAt.getDate() < Date.now()) {
        return PostStatus.Closed;
    }

    if (doc.participants.length >= doc.participantCount) {
        return PostStatus.Full;
    }

    return PostStatus.Closed;
}