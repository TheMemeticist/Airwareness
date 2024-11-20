import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Tile.module.css';
import { IconButton, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Tile = React.memo(({ title, children, collapsible = true, icon, count, helpText, renderHelpIcon = true, isRoomTile = false }) => {
  const [tileState, setTileState] = useState({
    isCollapsed: collapsible,
    isExpanded: false,
    isTransitioning: false
  });

  const expandTile = useCallback((e) => {
    e?.stopPropagation();
    if (collapsible && tileState.isCollapsed) {
      setTileState(prev => ({ ...prev, isCollapsed: false, isExpanded: true }));
    }
  }, [collapsible, tileState.isCollapsed]);

  const toggleTile = useCallback((e) => {
    e.stopPropagation();
    if (!collapsible) return;

    setTileState(prev => {
      if (!prev.isCollapsed) {
        requestAnimationFrame(() => {
          setTileState(p => ({ ...p, isExpanded: false }));
          requestAnimationFrame(() => {
            setTileState(p => ({ ...p, isTransitioning: false }));
          });
        });
        return { ...prev, isTransitioning: true, isCollapsed: true };
      }
      return { ...prev, isCollapsed: !prev.isCollapsed, isExpanded: false };
    });
  }, [collapsible]);

  const tileClassName = useMemo(() => {
    const classes = [
      styles.tile,
      tileState.isCollapsed && styles.collapsed,
      isRoomTile && styles.roomTile,
      tileState.isCollapsed && styles.cursorPointer,
      tileState.isExpanded && styles.expanded,
      !tileState.isCollapsed && styles.uncollapsed
    ].filter(Boolean).join(' ');
    return classes;
  }, [tileState.isCollapsed, tileState.isExpanded, isRoomTile]);

  const showPlaceholder = useMemo(() => (
    !isRoomTile && (!tileState.isCollapsed || tileState.isExpanded || tileState.isTransitioning)
  ), [isRoomTile, tileState]);

  return (
    <>
      {showPlaceholder && (
        <div 
          className={`${styles.placeholder} ${(!tileState.isCollapsed || tileState.isExpanded || tileState.isTransitioning) ? styles.visible : ''}`} 
          style={{ transition: 'opacity 0.4s cubic-bezier(0.2, 0, 0, 1)' }}
        />
      )}
      <div className={tileClassName} onClick={expandTile}>
        <div className={styles['tile-header-container']}>
          <Typography variant="h5" className={styles['tile-header']}>
            {typeof title === 'function' 
              ? title({ isCollapsed: tileState.isCollapsed }) 
              : title}
          </Typography>
          <div className={styles['tile-header-icons']}>
            {helpText && renderHelpIcon && !tileState.isCollapsed && (
              <div className={styles['help-icon-container']} title={helpText}>
                <HelpOutlineIcon className={styles['help-icon']} />
              </div>
            )}
            {collapsible && (
              <IconButton size="small" onClick={toggleTile}>
                {tileState.isCollapsed ? <ExpandMoreIcon sx={{ color: 'var(--off-white)' }} /> : <ExpandLessIcon sx={{ color: 'var(--off-white)' }} />}
              </IconButton>
            )}
          </div>
        </div>
        {tileState.isCollapsed ? (
          <div className={styles['collapsed-content']}>
            <div className={styles['minimized-icon']}>{icon}</div>
            <Typography>{count}</Typography>
          </div>
        ) : (
          typeof children === 'function' 
            ? children({ isCollapsed: tileState.isCollapsed }) 
            : children
        )}
      </div>
      {!isRoomTile && (!tileState.isCollapsed || tileState.isTransitioning) && (
        <div className={styles.backdrop} onClick={toggleTile} />
      )}
    </>
  );
});

export default Tile;