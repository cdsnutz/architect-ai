/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}