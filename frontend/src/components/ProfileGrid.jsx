import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileCard from './ProfileCard';

const ProfileGrid = ({ profiles }) => {
  const [visibleProfiles, setVisibleProfiles] = useState(10); // Initial load count
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleProfiles((prev) => prev + 10); // Load more profiles when scrolled down
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-4">
      {profiles && profiles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {profiles.slice(0, visibleProfiles).map((profile, index) => (
            <motion.div
              key={profile._id || profile.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ProfileCard profile={profile} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No profiles available.</div>
      )}

      {/* Load More Trigger Element */}
      <div ref={loadMoreRef} className="w-full h-10"></div>
    </div>
  );
};

export default ProfileGrid;
