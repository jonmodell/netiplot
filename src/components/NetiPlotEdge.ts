import { NetiPlotNode } from './NetiPlotNode';
import { NetiPlotEdgeDefinition, NetiPlotEdgeStyle } from '../types';
import { getDistanceToBezierEdge, getDistanceToLine } from './util';

const DEFAULT_STYLE = { color: '#777777', lineWidth: 2, font: '6px lato' };

class Edge {
  id: string;
  delete: boolean = false;
  definition: NetiPlotEdgeDefinition;
  start: NetiPlotNode;
  end: NetiPlotNode;
  size: number | null;
  style: NetiPlotEdgeStyle | null;
  dupNumber: number;
  oldPoints: { sx: number | null; sy: number | null; ex: number | null; ey: number | null };
  cp: { x: number; y: number } | null;
  labelXY: { x: number; y: number };
  labelAngle: number;

  constructor(id: string | number, definition: NetiPlotEdgeDefinition, toNode: NetiPlotNode, fromNode: NetiPlotNode, dupNumber: number | undefined) {
    this.id = id.toString();
    this.definition = definition;
    this.start = fromNode;
    this.end = toNode;
    this.size = definition.size || null;
    this.style = null;
    this.dupNumber = dupNumber || 0; // used to extend control points for curves

    // internal
    this.oldPoints = { sx: null, sy: null, ex: null, ey: null };
    this.cp = null;
    this.labelXY = { x: 0, y: 0 };
    this.labelAngle = 0;
  }

  getControlPoint() {
    if (!this.start || !this.end) {
      return { x: 0, y: 0 };
    }
    const dn = this.dupNumber || 0;
    const cp = {
      x: this.end.x + (this.end.x > this.start.x ? 1 : -1) * dn * 20,
      y: this.start.y - (this.end.y > this.start.y ? 1 : -1) * dn * 20,
    };
    return cp;
  }

  // allows style to be set from parent
  setStyle(style: NetiPlotEdgeStyle) {
    this.style = style;
  }

  // used to help with mouseover / hover to determine how far a point is from this edge
  getDistanceFrom(pt: { x: number; y: number }, opts: { lineStyle?: string }) {
    if (!this.start || !this.end) {
      return null;
    }
    let ret = null;
    const st = this.start;
    const ed = this.end;
    if (opts.lineStyle !== 'straight' || this.dupNumber) {
      const cp = this.getControlPoint();
      ret = getDistanceToBezierEdge(
        st.x,
        st.y,
        ed.x,
        ed.y,
        pt.x,
        pt.y,
        cp.x,
        cp.y,
      );
    } else {
      ret = getDistanceToLine(st.x, st.y, ed.x, ed.y, pt.x, pt.y);
    }
    return ret;
  }

  destroy() {
    this.delete = true;
  }

  update(definition: NetiPlotEdgeDefinition) {
    this.definition = definition;
  }

  getQuadraticXY(coef: number, sx: number, sy: number, cp1x: number, cp1y: number, ex: number, ey: number) {
    let t = Number(coef) || 0.5;
    // as x axis vs y axis diff between start and end becomes smaller, label drifts closer to the start or end, so change the coef
    const xDiff = Math.abs(sx - ex);
    const yDiff = Math.abs(sy - ey);
    const diffRatio = xDiff / yDiff;
    if (diffRatio > 1) {
      const drift = Math.min(5, Math.sqrt(diffRatio)) / 5;
      t -= 0.15 * drift;
    } else if (diffRatio < 1) {
      const drift = 1 - Math.sqrt(diffRatio);
      t += 0.25 * drift;
    }
    return {
      x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cp1x + t * t * ex,
      y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cp1y + t * t * ey,
    };
  }

  getQuadraticAngle(coef: number, sx: number, sy: number, cp1x: number, cp1y: number, ex: number, ey: number) {
    let t = Number(coef) || 0.5;
    // as x axis vs y axis diff between start and end becomes smaller, label drifts closer to the start or end, so change the coef
    const xDiff = Math.abs(sx - ex);
    const yDiff = Math.abs(sy - ey);
    const diffRatio = xDiff / yDiff;
    if (diffRatio > 1) {
      const drift = Math.min(5, Math.sqrt(diffRatio)) / 5;
      t -= 0.15 * drift;
    } else if (diffRatio < 1) {
      const drift = 1 - Math.sqrt(diffRatio);
      t += 0.25 * drift;
    }
    const dx = 2 * (1 - t) * (cp1x - sx) + 2 * t * (ex - cp1x);
    const dy = 2 * (1 - t) * (cp1y - sy) + 2 * t * (ey - cp1y);
    return -Math.atan2(dx, dy) + 0.5 * Math.PI;
  }

  calculateLabelPoints() {
    const coef = 0.5;
    // get control points
    this.cp = this.getControlPoint();
    const cp = this.cp;
    this.labelXY = this.getQuadraticXY(
      coef,
      this.start.x,
      this.start.y,
      cp.x,
      cp.y,
      this.end.x,
      this.end.y,
    );
    this.labelAngle = this.getQuadraticAngle(
      coef,
      this.start.x,
      this.start.y,
      cp.x,
      cp.y,
      this.end.x,
      this.end.y,
    );
  }

  render(state: any, context: CanvasRenderingContext2D) {
    if (!this.start || !this.end) {
      return false;
    }
    const opts = state.options.edges;
    const op = this.oldPoints;
    const hovering = state.rolloverItem === this;

    // don't render if the node has the same start and end points - all calculations will = 0,0;
    if (this.start?.x === this.end?.x && this.start?.y === this.end?.y) {
      return true;
    }

    // cache computations if nothing has changed
    if (
      (opts.lineStyle !== 'straight' || this.dupNumber) &&
      (op.sx !== this.start.x ||
        op.sy !== this.start.y ||
        op.ex !== this.end.x ||
        op.ey !== this.end.y)
    ) {
      this.calculateLabelPoints();
    }
    const arrowPlacementRatio = opts.arrowPlacementRatio || 0.5; // where to put the arrowhead
    const st = {
      ...DEFAULT_STYLE,
      ...(this.definition.style || {}),
    };
    let color;
    const ctx = context;
    if (Array.isArray(st.color)) {
      const grad = ctx.createLinearGradient(
        this.start.x,
        this.start.y,
        this.end.x,
        this.end.y,
      );
      st.color.forEach((c) => {
        grad.addColorStop(st.color.indexOf(c), c);
      });
      color = grad;
    } else {
      color = st.color;
    }

    const cp = this.cp;
    const lineWidth = hovering ? 4 / state.scale : st.lineWidth / state.scale;
    ctx.save();
    ctx.translate(0, 0);

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    // draw line
    if (opts.lineStyle === 'straight' && !this.dupNumber) {
      ctx.lineTo(this.end.x, this.end.y);
    } else {
      ctx.quadraticCurveTo(cp!.x, cp!.y, this.end.x, this.end.y);
    }
    ctx.stroke();
    ctx.closePath();

    // label
    if (
      this.definition.label &&
      state.options.edges.showLabels &&
      state.scale > 0.75
    ) {
      ctx.beginPath();
      // may get slow to call this every time so we could cache and calculate only on change
      // but there is no change listener yet
      let scaleCoeficient = 1;
      if (state.scale > 1.5) {
        scaleCoeficient = 0.5;
      } else if (state.scale < 0.75) {
        scaleCoeficient = 1.2;
      }
      const sf = state.scale * scaleCoeficient;
      const fontSize = scaleCoeficient < 1 ? 7 / sf : 11 / sf;

      const pxy = this.labelXY;
      const pa = this.labelAngle;
      if (opts.lineStyle === 'straight' && !this.dupNumber) {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        const transX = this.end.x - dx / 2;
        const transY = this.end.y - 10 - dy / 2;
        ctx.translate(transX, transY);
        if (dx < 0) {
          ctx.rotate(Math.atan2(dy, dx) - Math.PI);
        } else {
          ctx.rotate(Math.atan2(dy, dx));
        }
      } else {
        // curves
        ctx.translate(
          pxy.x + (pxy!.x > this.start.x ? 5 : -5),
          pxy.y + (pxy!.y < this.start.y ? 5 : -5),
        );
        ctx.rotate(pxy.x > this.start.x ? pa : pa - Math.PI);
      }

      ctx.fillStyle = st.fontColor || color;
      ctx.font = `${fontSize}px Lato, Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.definition.label || 'undef', 2, 1);
    }

    ctx.restore();
    ctx.save();

    // directional arrow  ---------
    if (opts.arrowheads) {
      ctx.beginPath();

      let arrowPoint = null;
      let arrowAngle = null;
      if (opts.lineStyle !== 'straight' || this.dupNumber) {
        // Arrowhead point and angle, possibly
        arrowPoint = this.getQuadraticXY(
          arrowPlacementRatio,
          this.start.x,
          this.start.y,
          cp!.x,
          cp!.y,
          this.end.x,
          this.end.y,
        );
        arrowAngle = this.getQuadraticAngle(
          arrowPlacementRatio,
          this.start.x,
          this.start.y,
          cp!.x,
          cp!.y,
          this.end.x,
          this.end.y,
        );
      } else {
        // straight style
        const s = this.start;
        const e = this.end;

        const xlen = e.x - s.x; // length of horizontal edge
        const ylen = e.y - s.y; // length of vertial edge
        arrowPoint = {
          x: e.x - xlen * arrowPlacementRatio,
          y: e.y - ylen * arrowPlacementRatio,
        }; // set the x and y to partial x and y
        arrowAngle = this.getQuadraticAngle(
          arrowPlacementRatio,
          s.x,
          s.y,
          arrowPoint.x,
          arrowPoint.y,
          e.x,
          e.y,
        );
      }

      ctx.translate(arrowPoint.x, arrowPoint.y);
      ctx.rotate(arrowAngle);
      // arrow drawing
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, -2);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 2);
      ctx.lineTo(-3, 0);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
    // END directional indicator ------------

    ctx.restore();
    return true;
  }
}

export { Edge, Edge as NetiPlotEdge };
