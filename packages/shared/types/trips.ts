export interface CreateTripRequest {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
}

export interface InviteToTripRequest {
  email: string;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}
