import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styles from './Tile.module.css';
import { IconButton, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Tile = React.memo(({ title, children, collapsible = true, icon, count, helpText, renderHelpIcon = true, isRoomTile = false }) => {
  const [tileState, setTileState] = useState({
    isCollapsed: collapsible,
    isExpanded: false,
    isTransitioning: false,
    originalPosition: null
  });
  const tileRef = useRef(null);
  const [backdropVisible, setBackdropVisible] = useState(false);

  const capturePosition = useCallback(() => {
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }, []);

  const expandTile = useCallback((e) => {
    if (!tileState.isCollapsed && !e?.target?.closest(`.${styles['tile-header-container']}`)) {
      return;
    }
    
    e?.stopPropagation();
    if (collapsible && tileState.isCollapsed) {
      const position = capturePosition();
      setTileState(prev => ({ 
        ...prev, 
        isCollapsed: false, 
        isExpanded: true,
        isTransitioning: true,
        originalPosition: position 
      }));
      requestAnimationFrame(() => {
        setBackdropVisible(true);
      });
      
      setTimeout(() => {
        setTileState(prev => ({
          ...prev,
          isTransitioning: false
        }));
      }, 400);
    }
  }, [collapsible, tileState.isCollapsed, capturePosition]);

  const toggleTile = useCallback((e) => {
    e.stopPropagation();
    if (!collapsible || tileState.isTransitioning) return;

    setTileState(prev => {
      if (!prev.isCollapsed) {
        setBackdropVisible(false);
        requestAnimationFrame(() => {
          setTileState(p => ({ ...p, isExpanded: false }));
          setTimeout(() => {
            setTileState(p => ({ 
              ...p, 
              isTransitioning: false,
              originalPosition: null 
            }));
          }, 420);
        });
        return { ...prev, isTransitioning: true, isCollapsed: true };
      }
      const position = capturePosition();
      requestAnimationFrame(() => {
        setBackdropVisible(true);
      });
      return { 
        ...prev, 
        isCollapsed: false, 
        isExpanded: true,
        originalPosition: position 
      };
    });
  }, [collapsible, capturePosition, tileState.isTransitioning]);

  const tileClassName = useMemo(() => {
    const classes = [
      styles.tile,
      tileState.isCollapsed && styles.collapsed,
      isRoomTile && styles.roomTile,
      tileState.isCollapsed && styles.cursorPointer,
      tileState.isExpanded && styles.expanded,
      !tileState.isCollapsed && styles.uncollapsed,
      (tileState.isTransitioning || tileState.isExpanded) && styles.isTransitioning
    ].filter(Boolean).join(' ');
    return classes;
  }, [tileState.isCollapsed, tileState.isExpanded, tileState.isTransitioning, isRoomTile]);

  const showPlaceholder = useMemo(() => (
    !isRoomTile && (!tileState.isCollapsed || tileState.isExpanded || tileState.isTransitioning)
  ), [isRoomTile, tileState]);

  return (
    <>
      {showPlaceholder && (
        <div 
          className={`${styles.placeholder} ${(!tileState.isCollapsed || tileState.isExpanded || tileState.isTransitioning) ? styles.visible : ''}`} 
          style={{ transition: 'opacity 0.4s linear' }}
        />
      )}
      <div 
        ref={tileRef}
        className={tileClassName} 
        onClick={expandTile}
        style={tileState.originalPosition && tileState.isTransitioning ? {
          position: 'fixed',
          left: `${tileState.originalPosition.left}px`,
          top: `${tileState.originalPosition.top}px`,
          width: `${tileState.originalPosition.width}px`,
          height: `${tileState.originalPosition.height}px`,
          transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)'
        } : undefined}
      >
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
            {typeof children === 'function' ? children({ isCollapsed: true }) : children}
          </div>
        ) : (
          typeof children === 'function' 
            ? children({ isCollapsed: false }) 
            : children
        )}
      </div>
      {!isRoomTile && (!tileState.isCollapsed || tileState.isTransitioning) && (
        <div 
          className={`${styles.backdrop} ${backdropVisible ? styles.visible : ''}`} 
          onClick={toggleTile}
        />
      )}
    </>
  );
});

export default Tile;