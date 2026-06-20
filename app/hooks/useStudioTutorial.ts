import { useCallback } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

export function useStudioTutorial() {
    const startTutorial = useCallback(() => {
        const driverObj = driver({
            showProgress: true,
            allowClose: false,
            steps: [
                {
                    element: "#tutorial-1",
                    popover: {
                        title: "Let's start",
                        description: "Drag a panel and drop it directly to any column you want.",
                        side: "right",
                        align: "center"
                    },
                    onHighlighted: (element, step, { driver }) => {
                        const handleDragEnd = () => {
                            setTimeout(() => {
                                driver.moveNext()
                            }, 300)
                            window.removeEventListener("mouseup", handleDragEnd)
                        }
                        window.addEventListener("mouseup", handleDragEnd)
                    }
                },
                {
                    element: "#tutorial-2",
                    popover: {
                        title: "Live Preview",
                        description: "This is called Canvas. You can see any changes you made in real time right here.",
                        side: "left",
                        align: "center"
                    }
                },
                {
                    element: "#tutorial-3",
                    popover: {
                        title: "Live Preview",
                        description: "Interact with the canvas element to proceed automatically.",
                        side: "left",
                        align: "center"
                    },
                },
                {
                    element: "#tutorial-2",
                    popover: {
                        title: "Live Preview",
                        description: "This is called Canvas. You can see any changes you made in real time right here.",
                        side: "left",
                        align: "center"
                    },
                    onHighlighted: (element, step, { driver }) => {
                        const handleCanvasMessage = (event: MessageEvent) => {
                            if (event.data?.type === 'element-selected') {
                                setTimeout(() => {
                                    driver.moveNext()
                                }, 300)
                                window.removeEventListener("message", handleCanvasMessage)
                            }
                        }
                        window.addEventListener("message", handleCanvasMessage)
                    }
                },
                {
                    element: "#tutorial-4",
                    popover: {
                        title: "Color Selection",
                        description: "Modify the color configuration settings here.",
                        side: "right",
                        align: "center"
                    },
                    onHighlighted: (element, step, { driver }) => {
                        const targetBox = document.querySelector("#tutorial-4")

                        const advanceStep = () => {
                            setTimeout(() => {
                                driver.moveNext()
                            }, 400)
                            window.removeEventListener("change", handleGlobalChange)
                            window.removeEventListener("mousedown", handleGlobalCaptureClick, true)
                        }

                        // Scenario A: User picks a color and triggers a standard change/input value event
                        const handleGlobalChange = (event: Event) => {
                            const target = event.target as HTMLElement
                            if (targetBox?.contains(target)) {
                                advanceStep()
                            }
                        }

                        // Scenario B: User interacts with a floating color popover menu (Portals outside your root layout)
                        const handleGlobalCaptureClick = (event: MouseEvent) => {
                            const target = event.target as HTMLElement
                            const isDropdownOrPortal = target.closest('[role="dialog"]') || 
                                                       target.closest('.color-picker') || 
                                                       target.closest('[data-radix-popper-content-wrapper]')

                            if (targetBox?.contains(target) || isDropdownOrPortal) {
                                advanceStep()
                            }
                        }

                        window.addEventListener("change", handleGlobalChange)
                        window.addEventListener("mousedown", handleGlobalCaptureClick, true)
                    }
                },
                {
                    element: "#tutorial-5",
                    popover: {
                        title: "Live Preview",
                        description: "This is called Canvas. You can see any changes you made in real time right here.",
                        side: "right",
                        align: "center"
                    }
                },
                {
                    element: "#tutorial-6",
                    popover: {
                        title: "Live Preview",
                        description: "This is called Canvas. You can see any changes you made in real time right here.",
                        side: "right",
                        align: "center"
                    }
                },
            ]
        })

        driverObj.drive()
    }, [])

    return { startTutorial }
}