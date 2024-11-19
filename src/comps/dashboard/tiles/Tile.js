import React, { useState, useEffect } from 'react';
import styles from './Tile.module.css';
import { IconButton, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Tile = ({ title, children, collapsible = true, icon, count, helpText, renderHelpIcon = true, isRoomTile = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!collapsible) {
      setIsCollapsed(false);
    }
  }, [collapsible]);

  const expandTile = () => {
    if (collapsible && isCollapsed) {
      setIsCollapsed(false);
      setIsExpanded(true);
    }
  };

  const toggleTile = (e) => {
    e.stopPropagation();
    if (collapsible) {
      if (!isCollapsed) {
        setIsTransitioning(true);
        setIsCollapsed(true);
        setTimeout(() => {
          setIsExpanded(false);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 400);
      } else {
        setIsCollapsed(!isCollapsed);
        setIsExpanded(false);
      }
    }
  };

  const tileClassName = `${styles.tile} ${isCollapsed ? styles.collapsed : ''} ${isRoomTile ? styles.roomTile : ''} ${
    isCollapsed ? styles.cursorPointer : ''
  } ${isExpanded ? styles.expanded : ''} ${isCollapsed ? '' : styles.uncollapsed}`;

  const showPlaceholder = !isRoomTile && (!isCollapsed || isExpanded || isTransitioning);

  return (
    <>
      {showPlaceholder && (
        <div 
          className={`${styles.placeholder} ${(!isCollapsed || isExpanded || isTransitioning) ? styles.visible : ''}`} 
          style={{ transition: 'opacity 0.4s cubic-bezier(0.2, 0, 0, 1)' }}
        />
      )}
      <div className={tileClassName} onClick={expandTile}>
        <div className={styles['tile-header-container']}>
          <Typography variant="h5" className={styles['tile-header']}>
            {title}
          </Typography>
          <div className={styles['tile-header-icons']}>
            {helpText && renderHelpIcon && !isCollapsed && (
              <div className={styles['help-icon-container']} title={helpText}>
                <HelpOutlineIcon className={styles['help-icon']} />
              </div>
            )}
            {collapsible && (
              <IconButton size="small" onClick={toggleTile}>
                {isCollapsed ? <ExpandMoreIcon sx={{ color: 'var(--off-white)' }} /> : <ExpandLessIcon sx={{ color: 'var(--off-white)' }} />}
              </IconButton>
            )}
          </div>
        </div>
        {isCollapsed ? (
          <div className={styles['collapsed-content']}>
            <div className={styles['minimized-icon']}>{icon}</div>
            <Typography>{count}</Typography>
          </div>
        ) : (
          typeof children === 'function' ? children({ isCollapsed }) : children
        )}
      </div>
      {!isRoomTile && (!isCollapsed || isTransitioning) && (
        <div className={styles.backdrop} onClick={toggleTile} />
      )}
    </>
  );
};

export default Tile;