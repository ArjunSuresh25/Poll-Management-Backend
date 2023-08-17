CREATE TABLE "Users" (
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("username")
);

CREATE TABLE "Polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Polls_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Polls_username_fkey" FOREIGN KEY ("username") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Poll_Votes" (
    "id" TEXT NOT NULL,
    "votes" INTEGER[] NOT NULL,

    CONSTRAINT "Poll_Votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Polls_Votes_id_fkey" FOREIGN KEY ("id") REFERENCES "Polls"("id") ON DELETE CASCADE ON UPDATE CASCADE
);