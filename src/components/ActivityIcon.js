import React from 'react';
import { Dumbbell, HeartPulse, Music, BookOpen, SwatchBook, Palmtree } from 'lucide-react';

export const activityIcons = {
    Dumbbell: Dumbbell,
    HeartPulse: HeartPulse,
    Music: Music,
    BookOpen: BookOpen,
    SwatchBook: SwatchBook,
    Palmtree: Palmtree
};

const ActivityIcon = ({ name, ...props }) => {
    const IconComponent = activityIcons[name];
    return IconComponent ? <IconComponent {...props} /> : <Dumbbell {...props} />;
};

export default ActivityIcon;