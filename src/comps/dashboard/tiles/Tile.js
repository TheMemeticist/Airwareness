import React, { useState } from 'react';
import styles from './Tile.module.css';
import { IconButton, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Tile = ({ title, children, collapsible = false, icon, count, helpText, renderHelpIcon = true, isRoomTile = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const expandTile = () => {
    if (collapsible && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const toggleTile = (e) => {
    e.stopPropagation();
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const tileClassName = `${styles.tile} ${isCollapsed ? styles.collapsed : ''} ${isRoomTile ? styles.roomTile : ''} ${isCollapsed ? styles.cursorPointer : ''}`;

  return (
    <>
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
      {!isRoomTile && <div className={styles.backdrop} onClick={expandTile}></div>}
    </>
  );
};

export default Tile;