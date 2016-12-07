

export interface ControllerT {
    transformPathPart?: { (part: string): string },
    transformPath?: { (path: string): string }
}
