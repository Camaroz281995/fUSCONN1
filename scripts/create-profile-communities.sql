-- Create profile communities table
CREATE TABLE IF NOT EXISTS profile_communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL
);

-- Create profile community members table
CREATE TABLE IF NOT EXISTS profile_community_members (
  community_id TEXT NOT NULL REFERENCES profile_communities(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  PRIMARY KEY (community_id, username)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_communities_creator ON profile_communities(creator);
CREATE INDEX IF NOT EXISTS idx_profile_community_members_username ON profile_community_members(username);
