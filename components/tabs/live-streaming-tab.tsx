"use client";

import { useState } from "react";

type Club = {
  id: number;
  name: string;
  description: string;
  owner: string;
  members: number;
};

export default function ClubsPage() {

  const [clubs, setClubs] = useState<Club[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function createClub() {
    if (!name) return;

    const newClub = {
      id: Date.now(),
      name,
      description,
      owner: "You",
      members: 1,
    };

    setClubs([...clubs, newClub]);

    setName("");
    setDescription("");
    setShowCreate(false);
  }


  return (
    <main className="min-h-screen bg-[#d6c7a1] p-6">

      {/* Header */}
      <div className="border-4 border-black bg-[#f5e6c8] p-5 shadow-[5px_5px_0px_black]">

        <h1 className="text-4xl font-bold">
          👥 Fusion Clubs
        </h1>

        <p className="mt-2">
          Create a club. Invite people. Build a community. You Belong.
        </p>

      </div>


      {/* Create Button */}
      <button
        onClick={() => setShowCreate(true)}
        className="mt-6 bg-[#3366cc] text-white border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_black]"
      >
        + Create New Club
      </button>


      {/* Create Club Box */}
      {showCreate && (

        <div className="mt-6 border-4 border-black bg-white p-5">

          <h2 className="text-2xl font-bold">
            Create Your Club
          </h2>


          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Club Name"
            className="mt-4 w-full border-2 border-black p-3"
          />


          <textarea
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            placeholder="What is this club about?"
            className="mt-3 w-full border-2 border-black p-3"
          />


          <button
            onClick={createClub}
            className="mt-4 bg-green-600 text-white border-2 border-black px-5 py-2"
          >
            Create Club
          </button>

        </div>

      )}



      {/* Clubs List */}
      <div className="mt-8">

        <h2 className="text-3xl font-bold mb-4">
          📌 Community Clubs
        </h2>


        {clubs.length === 0 ? (

          <div className="border-4 border-dashed border-black bg-[#fff7e6] p-8 text-center">

            <h3 className="text-xl font-bold">
              No clubs yet!
            </h3>

            <p>
              Be the first person to create one.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {clubs.map((club)=>(

              <div
                key={club.id}
                className="border-4 border-black bg-[#fff7e6] p-5 shadow-[4px_4px_0px_black]"
              >

                <h3 className="text-2xl font-bold">
                  {club.name}
                </h3>

                <p className="mt-2">
                  {club.description}
                </p>


                <div className="mt-3 text-sm">
                  Created by: {club.owner}
                  <br/>
                  👥 {club.members} member
                </div>


                <button
                  className="mt-4 border-2 border-black px-4 py-2 bg-yellow-300"
                >
                  Join Club
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>
  );
}
