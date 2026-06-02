import { Participant, PostDocument } from "../documents/PostDocument";
import { ParticipantType, PostId, PostStatus, UserId } from "../ids";

export interface PostCreationRequest {
    rule: string;
    title: string;
    description?: string;
    recruitEndsAt?: Date;

    sessionMode: string;
    sessionLocation?: string;
    sessionDateType: string; // fixed, range, autodate
    sessionFixedDate?: Date; // present if fixed
    sessionRangeDetails?: string; // present if range

    gmCount: number;
    playerCount: number;
    participantCount: number;
    publishParticipants: boolean;
    acceptJoinRequests: boolean;
    participants: Participant[];
}

export interface PostFilterRequest {
    authorId?: UserId;
    rule?: string;
    sessionMode?: string;
    status?: PostStatus;
}

export interface PostListEntryResponse {
    postId: PostId;
    rule: string;
    title: string;
    sessionMode: string;

    gmCount: number;
    playerCount: number;
    participantCount: number;
    participants: ParticipantType[];
    
    status: PostStatus;
}

export interface PostListResponse {
    entries: PostListEntryResponse[];
}

export interface PostBodyResponse extends PostDocument {
}